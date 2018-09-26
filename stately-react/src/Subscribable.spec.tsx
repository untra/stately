import 'mocha'
import { expect } from 'chai'
import { spy } from 'sinon'
import { mount, ReactWrapper } from 'enzyme'

import * as React from 'react'
//import { Reducer, Action, Store, createStore, applyMiddleware } from 'redux'
import { Subject } from 'rxjs';

//import { $toMiddleware, $toEvents, EventAPI } from 'stately-async/observables'

import { Subscription, Subscriber, SubscriberDecorator, createSubjectContext, /*createStoreContext*/ } from './Subscribable'


const TestComponent: React.SFC<{
  className: string,
  onClick: () => void
}> = ({ className, onClick }) =>
  <div className={className}>
    <button
      onClick={onClick}>
    </button>
  </div>

describe('createSubjectContext', () => {
  let nextClassName: string
  let subject$: Subject<string>
  let Subscription: Subscription<string>
  let Subscriber: Subscriber<string>
  let subscriber: SubscriberDecorator<string>

  beforeEach(() => {
    nextClassName = 'test'
    subject$ = new Subject<string>()
    const context = createSubjectContext(subject$, 'initial')
    ;({ Subscription, Subscriber, subscriber } = context)
  })

  describe('<Subscription>', () => {
    it('should act as a standalone Subscriber', () => {
      const wrapper = mount(
        <Subscription>
          {(className, next) =>
            <TestComponent className={className} onClick={() => { next(nextClassName) }} />}
        </Subscription>
      )
      expect(wrapper).to.have.descendants('.initial')
      wrapper.find('button').simulate('click')
      expect(wrapper).not.to.have.descendants('.initial')
      expect(wrapper).to.have.descendants('.test')
      nextClassName = 'next'
      wrapper.find('button').simulate('click')
      expect(wrapper).not.to.have.descendants('.test')
      expect(wrapper).to.have.descendants('.next')
    })
  })

  describe('<Subscriber>', () => {
    let wrapper: ReactWrapper

    beforeEach(() => {
      wrapper = mount(
        <Subscription>
          <Subscriber>
            {(className, next) =>
              <TestComponent className={className} onClick={() => { next(nextClassName) }} />}
          </Subscriber>
        </Subscription>
      )
    })

    it('should receive value updates from an ancestral <Subscription>', () => {
      expect(wrapper).to.have.descendants('.initial')
      subject$.next('test')
      wrapper.update()
      expect(wrapper).not.to.have.descendants('.initial')
      expect(wrapper).to.have.descendants('.test')
      subject$.next('next')
      wrapper.update()
      expect(wrapper).not.to.have.descendants('.test')
      expect(wrapper).to.have.descendants('.next')
    })

    it('should send value updates to the Subject of an ancestral <Subscription>', () => {
      const subscriberSpy = spy()
      subject$.subscribe(subscriberSpy)
      wrapper.find('button').simulate('click')
      expect(subscriberSpy).to.have.been.calledWithMatch('test')
      nextClassName = 'next'
      wrapper.find('button').simulate('click')
      expect(subscriberSpy).to.have.been.calledWithMatch('next')
    })
  })

  describe('@subscriber(deriveProps)(Component)', () => {
    it('should apply Subscriber data to the decorated component as props using deriveProps', () => {
      /*
      // Decorators currently cannot modify a class signature (e.g. subtract props).
      // For now this can only be called as a normal function.
      // https://github.com/Microsoft/TypeScript/issues/4881
      @subscriber((className, next) => ({
        className,
        onClick: () => { next(nextClassName) }
      }))
      class DecoratedTestComponent extends React.Component {
        props: DProps
        render(): React.ReactNode {
          const { className, onClick } = this.props
          return <TestComponent className={className} onClick={onClick} />
        }
      }
      */

      const DecoratedTestComponent = subscriber((className, next) => ({
        className,
        onClick: () => { next(nextClassName) }
      }))(class extends React.Component<{
        className: string,
        onClick: () => void
      }> {
        render() {
          const { className, onClick } = this.props
          return <TestComponent className={className} onClick={onClick} />
        }
      })
      
      const wrapper = mount(
        <Subscription>
          <DecoratedTestComponent />
        </Subscription>
      )
      expect(wrapper).to.have.descendants('.initial')
      wrapper.find('button').simulate('click')
      expect(wrapper).not.to.have.descendants('.initial')
      expect(wrapper).to.have.descendants('.test')
      nextClassName = 'next'
      wrapper.find('button').simulate('click')
      expect(wrapper).not.to.have.descendants('.test')
      expect(wrapper).to.have.descendants('.next')
    })
  })
})

// interface ClassNameState { className: string }
  
// const classNameReducer: Reducer<ClassNameState> = (state = { className: 'initial' }, action) =>
//   action.type === 'CLASSNAME_SET' ? { className: action.className } : state

// describe('createStoreContext', () => {
//   let testStore: Store<ClassNameState>
//   let Subscription: Subscription<ClassNameState, Action>
//   let subscriber: SubscriberDecorator<ClassNameState, Action>

//   const WithController: React.SFC = () =>
//     <Subscription>
//       {(state, dispatch) =>
//         <context.Controller state={state} dispatch={dispatch}>
//           <div>
//             <TestComponent />
//           </div>
//         </context.Controller>}
//     </Subscription>

//   beforeEach(() => {
//     testStore = createStore(classNameReducer, { className: 'store' }, applyMiddleware($toMiddleware(action$)))
//     const context = createStoreContext(testStore)
//     ;({ Subscription, subscriber } = context)
//   })

//   describe('<Subscription>', () => {
//     it('should act as a standalone Subscriber', () => {
//       const wrapper = mount(
//         <Subscription>
//           {(className, next) =>
//             <TestComponent className={className} onClick={() => { next(nextClassName) }} />}
//         </Subscription>
//       )
//       expect(wrapper).to.have.descendants('.initial')
//       wrapper.find('button').simulate('click')
//       expect(wrapper).not.to.have.descendants('.initial')
//       expect(wrapper).to.have.descendants('.test')
//       nextClassName = 'next'
//       wrapper.find('button').simulate('click')
//       expect(wrapper).not.to.have.descendants('.test')
//       expect(wrapper).to.have.descendants('.next')
//     })
//   })

//   describe('<Subscriber>', () => {
//     let wrapper: ReactWrapper

//     beforeEach(() => {
//       wrapper = mount(
//         <Subscription>
//           <Subscriber>
//             {(className, next) =>
//               <TestComponent className={className} onClick={() => { next(nextClassName) }} />}
//           </Subscriber>
//         </Subscription>
//       )
//     })

//     it('should receive value updates from an ancestral <Subscription>', () => {
//       expect(wrapper).to.have.descendants('.initial')
//       subject$.next('test')
//       wrapper.update()
//       expect(wrapper).not.to.have.descendants('.initial')
//       expect(wrapper).to.have.descendants('.test')
//       subject$.next('next')
//       wrapper.update()
//       expect(wrapper).not.to.have.descendants('.test')
//       expect(wrapper).to.have.descendants('.next')
//     })

//     it('should send value updates to the Subject of an ancestral <Subscription>', () => {
//       const subscriberSpy = spy()
//       subject$.subscribe(subscriberSpy)
//       wrapper.find('button').simulate('click')
//       expect(subscriberSpy).to.have.been.calledWithMatch('test')
//       nextClassName = 'next'
//       wrapper.find('button').simulate('click')
//       expect(subscriberSpy).to.have.been.calledWithMatch('next')
//     })
//   })

//   describe('@subscriber(deriveProps)(Component)', () => {
//     it('should apply Subscriber data to the decorated component as props using deriveProps', () => {
//       /*
//       // Decorators currently cannot modify a class signature (e.g. subtract props).
//       // For now this can only be called as a normal function.
//       // https://github.com/Microsoft/TypeScript/issues/4881
//       @subscriber((className, next) => ({
//         className,
//         onClick: () => { next(nextClassName) }
//       }))
//       class DecoratedTestComponent extends React.Component {
//         props: DProps
//         render(): React.ReactNode {
//           const { className, onClick } = this.props
//           return <TestComponent className={className} onClick={onClick} />
//         }
//       }
//       */

//       const DecoratedTestComponent = subscriber((className, next) => ({
//         className,
//         onClick: () => { next(nextClassName) }
//       }))(class extends React.Component<{
//         className: string,
//         onClick: () => void
//       }> {
//         render() {
//           const { className, onClick } = this.props
//           return <TestComponent className={className} onClick={onClick} />
//         }
//       })
      
//       const wrapper = mount(
//         <Subscription>
//           <DecoratedTestComponent />
//         </Subscription>
//       )
//       expect(wrapper).to.have.descendants('.initial')
//       wrapper.find('button').simulate('click')
//       expect(wrapper).not.to.have.descendants('.initial')
//       expect(wrapper).to.have.descendants('.test')
//       nextClassName = 'next'
//       wrapper.find('button').simulate('click')
//       expect(wrapper).not.to.have.descendants('.test')
//       expect(wrapper).to.have.descendants('.next')
//     })
//   })
// })
